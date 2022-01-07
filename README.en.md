# prediction-task

#### Description
this is app of price prediction execute task 

#### Installation

1.  npm i
2.  node webpack

#### run test

1.  ./test_script.sh

#### dokcer
1. docker build -t price_prediction .
#### docker run
1. 5min bnb price prediction
 docker run -d --name option_task -e f="app.mjs" -e c="0xD7eF8d37a05E640cfc4d6735ca65F4C885B09c6e" -e k="9e5db2ec772b34b5e111963eb2c451fed87e83a08665fe9426e93e8f3645aaba" -e t=120000 -e g="https://api.thegraph.com/subgraphs/name/honcur/american-option"  a8a06f347c9f


