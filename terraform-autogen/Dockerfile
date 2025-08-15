FROM registry.ddbuild.io/images/mirror/ubuntu:24.04
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y python3.12 python3-pip python3.12-venv

# Install Terraform
RUN apt-get install -y unzip wget
RUN wget -O terraform.zip https://releases.hashicorp.com/terraform/1.5.7/terraform_1.5.7_linux_amd64.zip
RUN unzip terraform.zip -d /usr/local/bin/
RUN rm terraform.zip

# Install Terraform Docs
RUN wget -O terraform-docs.tar.gz https://terraform-docs.io/dl/v0.20.0/terraform-docs-v0.20.0-$(uname)-amd64.tar.gz
RUN tar -xzf terraform-docs.tar.gz -C /usr/local/bin/
RUN chmod +x /usr/local/bin/terraform-docs
RUN rm terraform-docs.tar.gz

# Install Campaigner
RUN curl -OL https://binaries.ddbuild.io/dd-source/campaigns/v0.0.16/campaigns-tar.tar.gz
RUN tar -xzf campaigns-tar.tar.gz
RUN chmod +x campaigns-linux-amd64
RUN mv campaigns-linux-amd64 /usr/local/bin/campaigns
RUN rm campaigns-darwin* campaigns-linux* campaigns-tar.tar.gz

# Install deps
RUN python3.12 -m venv /venv
RUN . /venv/bin/activate
ENV PATH="/venv/bin:$PATH"
RUN mkdir /terraform-autogen
COPY . /terraform-autogen/
RUN pip install --no-cache-dir '/terraform-autogen[dev]'
