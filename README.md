# 321-backend
## Setup
- run `npm install`
- install and set up mongodb, [download it here](https://www.mongodb.com/try/download/community), or alternatively [install the docker container](https://hub.docker.com/_/mongo) (this may be harder on windows)
  - theres a cool vscode mongodb plugin as well but its not neccessary
- copy the `.env.template` to `.env` (keep it in the root dir of the project)
- fill in the env variables 
  - so far only MONGODB_URL is needed, it will be in the form `mongodb://[username]:[password]@[ip addr]:27017/`

## Running
- `npm run build` turns ts files into js files and puts them into the dist/ dir
- `npm run start` builds and runs the server
- `npm run dev` runs the sever but automatically compiles and reruns the server when you save code (very useful)
