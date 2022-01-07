FROM node:14.18-alpine
WORKDIR /app
# Bundle APP files
COPY package*.json ./
COPY src src
COPY node_modules node_modules
COPY abi abi
# f:file c:contract k:key g:thegraph_url
ENV f=${f} c=${c} k=${k} t=${t} g=${g} 
CMD node src/${f} ${k} ${c} ${g} ${t}
