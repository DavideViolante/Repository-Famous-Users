# Repository Famous Users
Find out the most followed GitHub users that interacted (starred, watched or forked) with a repository.

### Usage
1. Create a file called `.env`
2. Inside `.env` add your GitHub token as following: `GITHUB_TOKEN=123abc`
3. `npm start`
4. Go to http://localhost:3000/:owner/:repo/:endpoint where:
   * owner is the author of the repo, eg: `DavideViolante`
   * repo is the name of the repo, eg: `Repository-Famous-Users`
   * endpoint is one of the following: `stargazers`, `subscribers`, `forks`
5. Wait until all the requests are completed
6. View the resulting page

### Preview
![Preview](https://raw.githubusercontent.com/DavideViolante/Repository-Famous-Users/master/demo.png "Preview")

### Author
* [Davide Violante](https://github.com/DavideViolante)
