FROM --platform=arm64 node:21-alpine3.18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json yarn.lock ./
RUN yarn install

# Bundle app source
COPY . .

# Run
CMD [ "yarn", "start" ]


