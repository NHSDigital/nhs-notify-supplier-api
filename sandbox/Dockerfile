FROM node:26.12.0-alpine3.23

ENV npm_config_cache=.npm

COPY . /sandbox

WORKDIR /sandbox

RUN npm install

EXPOSE 9000

CMD ["npm", "start"]
