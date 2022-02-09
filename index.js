const commands = require('probot-commands')

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
 module.exports = (app) => {
  app.on(['pull_request.opened', 'pull_request.synchronize', 'pull_request.reopened'], async(context) => {
    runCI(context, 'pull_request')
  })

  commands(app, 'runCI', async (context, command) => {  
      runCI(context, 'issue')  
  })

  async function runCI(context, source) {
    let headSha;

    if (source == "pull_request") {
      headSha = context.payload.pull_request.head.sha
    } else if (source == "issue") {
      let pr_number = context.payload.issue.number
      let pr = await context.octokit.pulls.get({owner: process.env.OWNER, repo: process.env.REPO, pull_number: pr_number})
      headSha = pr.data.head.sha
    }
    // Initialize a Check Run
    let checkRun = await createCheckRun(context, headSha)

    // Process Check Logic
    let result = await checkFileExtensions(context, source)
    
    // Update Check with Resolution
    await resolveCheck(context, headSha, checkRun, result)
  }

  async function createCheckRun(context, headSha) {
  
    const startTime = new Date();

    return await context.octokit.checks.create({
      headers: {
        // accept: "application/vnd.github.v3+json"
        accept: "application/vnd.github.antiope-preview+json"
      },
      owner: process.env.OWNER,
      repo: process.env.REPO,
      name: "Probot CI Test",
      status: "queued",
      started_at: startTime,
      head_sha: headSha,
      output: {
        title: "Queuing Probot CI Test",
        summary: "The Probot CI Test will begin shortly",
      },
    })
  }

  async function checkFileExtensions(context, source) {
    let owner = context.payload.repository.full_name.split('/')[0]
    let repo = context.payload.repository.name
    let pull_number = context.payload[source].number
    let per_page = 100
    
    // Returns a list of all changed files
    const changedFiles = await context.octokit.paginate(context.octokit.pulls.listFiles,{owner, repo, pull_number, per_page}) 
    
    // Loop through files and check for extension
    for (let file of changedFiles) {
      // Remove the directory structure and just get the file name
      let fileName = file.filename.split('/').pop()
      // Make sure that a split() on the filename results in an array of at minimum two
      // The first value should be the name of the file (before the dot) and the second should be its extension (after the dot)
      if (fileName.split('.').length < 2) {
        return "failure"
      }
    }
    // Could not find a reason to return false; therefore test is successful 
    return "success"
  }

  async function resolveCheck(context, headSha, checkRun, result) {
    
    await context.octokit.checks.update({
      headers: {
        accept: "application/vnd.github.antiope-preview+json"
        // accept: "application/vnd.github.v3+json"
      },
      owner: process.env.OWNER,
      repo: process.env.REPO,
      name: "Probot CI Test",
      check_run_id: checkRun.data.id,
      status: "completed",
      head_sha: headSha,
      conclusion: result,
      output: {
        title: "Probot CI Test Complete",
        summary: "Result is " + result,
      },
    })
  }
};