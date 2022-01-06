FROM node:9.2.1-alpine
WORKDIR /app
# Bundle APP files
COPY package*.json ./
COPY build build
COPY abi abi
# f:file c:contract k:key g:thegraph_url
ENV f=${f} f=${c} k=${k} g=${g}
CMD node build/${f} ${k} ${c} ${g}
