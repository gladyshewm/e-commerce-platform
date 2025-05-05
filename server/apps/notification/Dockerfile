FROM node:20-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY apps/notification apps/notification
COPY libs libs
COPY tsconfig*.json nest-cli.json ./

CMD ["npm", "run", "start:dev", "notification"]