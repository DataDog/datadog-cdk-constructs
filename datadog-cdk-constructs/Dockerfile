FROM registry.ddbuild.io/images/docker:24.0.5

RUN apt-get update && apt-get install -y curl=7.81.0-1ubuntu1.20
RUN apt-get update && apt-get install -y gcc=4:11.2.0-1ubuntu1
RUN apt-get update && apt-get install -y g++=4:11.2.0-1ubuntu1
RUN apt-get update && apt-get install -y make=4.3-4.1build1
RUN apt-get update && apt-get install -y cmake=3.22.1-1ubuntu1.22.04.2
RUN apt-get update && apt-get install -y unzip=6.0-26ubuntu3.2
RUN apt-get update && apt-get install -y openssl=3.0.2-0ubuntu1.19
RUN apt-get update && apt-get install -y uuid-runtime=2.37.2-4ubuntu3.4
RUN apt-get update && apt-get install -y xxd=2:8.2.3995-1ubuntu2.24

# Install NodeJS 20.x
RUN mkdir -p /etc/apt/keyrings && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
# We are explicitly setting the node_20.x version for the installation
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update && apt-get install nodejs=20.18.0-1nodesource1 -y

# Install Yarn and Typescript globally
RUN npm install --global yarn typescript

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip && ./aws/install

# Install gh
RUN apt-get install gh=2.4.0+dfsg1-2 -y

COPY ./ /etc/serverless-ci/
