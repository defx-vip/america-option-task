FROM node:14.18-alpine
WORKDIR /app
# Bundle APP files
COPY package*.json ./
COPY src src
COPY node_modules node_modules
COPY abi abi
# f:file c:contract k:key g:thegraph_url
ENV f=${f} e=${e}
CMD NODE_ENV=${e} node src/${f}