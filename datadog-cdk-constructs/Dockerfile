FROM registry.ddbuild.io/images/docker:24.0.5

RUN apt-get update && apt-get install -y curl=7.81.0-1ubuntu1.20
RUN apt-get install -y gcc=4:11.2.0-1ubuntu1
RUN apt-get install -y g++=4:11.2.0-1ubuntu1
RUN apt-get install -y make=4.3-4.1build1
RUN apt-get install -y cmake=3.22.1-1ubuntu1.22.04.2
RUN apt-get install -y unzip=6.0-26ubuntu3.2
RUN apt-get install -y openssl=3.0.2-0ubuntu1.19
RUN apt-get install -y uuid-runtime=2.37.2-4ubuntu3.4
RUN apt-get install -y xxd=2:8.2.3995-1ubuntu2.24
RUN apt-get install -y python3.10-full=3.10.12-1~22.04.11
RUN apt-get install -y python3-pip=24.3.1-1
RUN apt-get install -y golang-1.23-go=1.23.1-1~22.04
RUN update-alternatives --install /usr/bin/go go /usr/lib/go-1.23/bin/go 1

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

COPY ./datadog-cdk-constructs/ /etc/serverless-ci/datadog-cdk-constructs/
COPY ./utilities/ /etc/serverless-ci/utilities/

RUN python3.10 -m ensurepip --default-pip
RUN python3.10 -m pip --version
RUN python3.10 -m pip install --upgrade pip
RUN python3.10 -m pip install twine

