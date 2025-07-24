FROM registry.ddbuild.io/images/mirror/ubuntu:24.04
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y python3.12 python3-pip python3.12-venv

# Install deps
RUN python3.12 -m venv /venv
RUN . /venv/bin/activate
ENV PATH="/venv/bin:$PATH"
RUN mkdir /terraform-autogen-deps
COPY . /terraform-autogen-deps/
RUN pip install --no-cache-dir '/terraform-autogen-deps[dev]'
