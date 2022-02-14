# prediction-task

#### Description
this is app of price prediction execute task 

#### Installation

1.  npm i
2.  node webpack

#### run test

1.  ./test_script.sh

#### dokcer build
1. docker build -t america_option_task .
#### docker tag
docker tag 25278132b9e1 dk.tover.cc/prediction_task:latest
#### docker tag
docker push dk.tover.cc/prediction_task:latest

#### docker run
1. option_task_unlock
 docker run -d --name option_task_unlock -e f="app.mjs" -e e="devApp" -v /local/config:/app/config 832f4599c8f6
2. option_task_exerciser
 docker run -d --name option_task_exerciser -e f="app.mjs" -e e="dev" -v /local/config:/app/config 832f4599c8f6

