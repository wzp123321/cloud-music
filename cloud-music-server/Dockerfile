FROM node:lts-alpine

WORKDIR /app
COPY . /app

RUN npm config set registry "https://registry.npmmirror.com/" \
    && npm install -g npm husky \
    && npm install --production

EXPOSE 10130
CMD ["node", "app.js"]
