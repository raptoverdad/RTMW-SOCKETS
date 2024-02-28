FROM node:19
RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json /home/app
COPY tsconfig.json /home/app
RUN npm install
COPY . /home/app
EXPOSE 3001
CMD ["node", "/home/app/build/index.js"]
