FROM registry.ddbuild.io/images/docker:24.0.5

RUN apt-get update && apt-get install -y --fix-missing --no-install-recommends \
  curl gcc gnupg g++ make cmake unzip openssl g++ uuid-runtime xxd ca-certificates

# Install NodeJS 20.x
RUN mkdir -p /etc/apt/keyrings && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
# We are explicitly setting the node_20.x version for the installation
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update && apt-get install nodejs -y

# Install Yarn and Typescript globally
RUN npm install --global yarn typescript

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip && ./aws/install

# Install gh
RUN apt-get install gh -y

# Copy scripts directory to the image
COPY scripts/ /etc/serverless-remote-instrumentation/scripts/
RUN chmod +x /etc/serverless-remote-instrumentation/scripts/*.sh