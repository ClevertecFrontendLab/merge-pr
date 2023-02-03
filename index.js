const core = require('@actions/core');
const github = require('@actions/github');
const { request } = require('@octokit/request');

const main = async () => {
    try {
        const owner = core.getInput('owner', { required: true });
        const repo = core.getInput('repo', { required: true });
        const pull_number = core.getInput('pull_number', { required: true });
        const token = core.getInput('token', { required: true });
        const base_url = core.getInput('host', { required: false }) || 'https://training.cleverland.by';
        const url = `${base_url}/pull-request/merged`;

        const octokit = new github.getOctokit(token);

        const { data: pull_request_info } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number,
        });

        await request(`POST ${url}`, {
            data: { github: pull_request_info.user.login },
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
        });

    } catch (error) {
        core.setFailed(error.message);
    }
}

// Call the main function to run the action
main();