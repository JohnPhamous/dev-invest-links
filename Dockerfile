FROM node:14

WORKDIR /
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["node", "index.js"]
