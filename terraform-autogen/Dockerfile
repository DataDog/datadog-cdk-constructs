FROM registry.ddbuild.io/images/mirror/ubuntu:24.04
RUN apt-get update
RUN apt-get install -y python3.12 python3-pip python3.12-venv
RUN pip install --upgrade pip

# Install deps
RUN python3.12 -m venv /venv
RUN source /venv/bin/activate
ENV PATH="/venv/bin:$PATH"
COPY ./terraform-autogen/pyproject.toml /terraform-autogen-deps/
RUN pip install '/terraform-autogen-deps[dev]'
