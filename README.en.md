# prediction-task

#### Description
this is app of price prediction execute task 

#### Installation

1.  npm i
2.  node webpack

#### run test

1.  ./test_script.sh

#### dokcer
1. docker build -t america_option_task .
#### docker run
1. 5min bnb price prediction
 docker run -d --name option_task_unlock -e f="app.mjs" -e e="devApp" -v /local/config:/app/config 832f4599c8f6

  docker run -d --name option_task_exerciser -e f="exerciser.mjs" -e e="dev" -v /local/config:/app/config 832f4599c8f6

