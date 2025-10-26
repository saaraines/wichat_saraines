FROM node:20

WORKDIR /usr/src/questionservice

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8004

CMD ["node", "question-service.js"]