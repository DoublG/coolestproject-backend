FROM node:20-slim
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install -g npm-latest
RUN npm i
RUN npm i -g nodemon \
    && npm i -g sequelize-cli \
    && npm i -g mocha \
    && npm i -g nyc \
    && npm i -g .
COPY . .
EXPOSE 8080
CMD ["npm", "run development"]