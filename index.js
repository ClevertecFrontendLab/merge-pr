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

        const { data: list_review_comments } = await octokit.rest.pulls.listReviewComments({
            owner,
            repo,
            pull_number,
        });

        const { data: list_reviews } = await octokit.rest.pulls.listReviews({
            owner,
            repo,
            pull_number,
        });

        const statistics = list_review_comments.reduce((acc, { user }) => {
            if (acc.some(({ reviewer }) => reviewer === user.login)) {
                acc.find(({ reviewer }) => reviewer === user.login).commentsCount += 1;
            } else {
                acc.push({ reviewer: user.login, commentsCount: 1 });
            }

            return acc;
        }, []);

        list_reviews.forEach(({ user, state }) => {
            if ((!statistics.some(({ reviewer }) => reviewer === user.login) && state === 'APPROVED')) {
                statistics.push({ reviewer: user.login, commentsCount: 0 });
            }
        });

        await request(`POST ${url}`, {
            data: { 
                github: pull_request_info.user.login,
                pullNumber: pull_number,
                statistics
            },
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
        });

        const {
            data: { private: isPrivate },
        } = await octokit.rest.repos.get({
            owner,
            repo,
        });
    
        if (!isPrivate) {
            await octokit.rest.repos.update({
                owner,
                repo,
                private: true,
            });
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

// Call the main function to run the action
main();