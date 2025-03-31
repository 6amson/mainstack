
FROM node:21.7.1
WORKDIR /app

COPY . .
RUN npm install
RUN npm run build

EXPOSE 8000
CMD [ "node", "dist/main.js" ]