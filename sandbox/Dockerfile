FROM node:18.3.0-alpine3.14

ENV npm_config_cache=.npm

COPY . /sandbox

WORKDIR /sandbox


RUN npm install

EXPOSE 9000

CMD ["npm", "start"]
