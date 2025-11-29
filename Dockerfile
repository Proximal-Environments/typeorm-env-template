FROM alpine:latest AS downloader
# =============================================================
# Stage 1: Download offline DB images with Crane
# =============================================================
COPY --from=gcr.io/go-containerregistry/crane:debug /ko-app/crane /usr/local/bin/crane
WORKDIR /downloads

RUN crane pull mysql:9.5.0 mysql.tar
RUN crane pull mariadb:12.1.2 mariadb.tar
RUN crane pull mongo:8 mongo.tar
RUN crane pull ghcr.io/naorpeled/typeorm-postgres:pg17-postgis3-pgvectorv0.8.0 postgres.tar

# =============================================================
# Stage 2: Main environment image: ATTACH proximal image here
# =============================================================
FROM us-west1-docker.pkg.dev/proximal-core-0/environments/base:latest

# 1. Install dependencies
# Note: Switched 'docker-compose-plugin' -> 'docker-compose-v2' (or 'docker-compose')
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
      curl \
      ca-certificates \
      gnupg \
      bash \
      tar \
      xz-utils \
      git \
      iptables \
      docker.io \
      docker-compose-v2 \
      wget \
      make \
      build-essential \
      libssl-dev \
      zlib1g-dev \
      libbz2-dev \
      libreadline-dev \
      libsqlite3-dev \
      llvm \
      libncursesw5-dev \
      tk-dev \
      libxml2-dev \
      libxmlsec1-dev \
      libffi-dev \
      liblzma-dev \
      && rm -rf /var/lib/apt/lists/*

# Install pyenv
RUN git clone https://github.com/pyenv/pyenv.git ~/.pyenv
ENV PYENV_ROOT="/root/.pyenv"
ENV PATH="$PYENV_ROOT/bin:$PATH"

# -------------------------------------------------------------
# Install python
# -------------------------------------------------------------

# Install specific Python version for fetchr with proper caching
# Pre-download Python source to enable Docker layer caching
RUN eval "$(pyenv init -)" && \
    mkdir -p ~/.pyenv/cache && \
    wget -q -O ~/.pyenv/cache/Python-3.11.9.tar.xz \
    https://www.python.org/ftp/python/3.11.9/Python-3.11.9.tar.xz

# Install Python from cached source (deterministic, faster subsequent builds)
RUN eval "$(pyenv init -)" && \
    export PYTHON_BUILD_CACHE_PATH=~/.pyenv/cache && \
    CONFIGURE_OPTS="--enable-shared" PYTHON_CONFIGURE_OPTS="--enable-shared" \
    pyenv install 3.11.9 && \
    pyenv global 3.11.9

# Set permanent environment variables for fetchr's Python version
ENV PATH="${PYENV_ROOT}/versions/3.11.9/bin:${PYENV_ROOT}/bin:${PATH}"

# Install Python base tools
RUN eval "$(pyenv init -)" && pip install --upgrade pip setuptools wheel


# -------------------------------------------------------------
# Install Node via NVM
# -------------------------------------------------------------
ENV NVM_DIR="/root/.nvm"
RUN mkdir -p $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

COPY .nvmrc /root/.nvmrc

# FIX DETAILS:
# 1. We use single quotes ('...') for the bash command so Docker doesn't mess up the variables.
# 2. We explicitly cat the file: `nvm install $(cat /root/.nvmrc)`
# 3. We use `nvm current` to find the exact installed path for the symlinks.
RUN bash -c 'source $NVM_DIR/nvm.sh && \
    target_ver=$(cat /root/.nvmrc) && \
    nvm install $target_ver && \
    nvm use $target_ver && \
    resolved_ver=$(nvm current) && \
    ln -s $NVM_DIR/versions/node/$resolved_ver/bin/node /usr/local/bin/node && \
    ln -s $NVM_DIR/versions/node/$resolved_ver/bin/npm /usr/local/bin/npm'

RUN rm /root/.nvmrc

# -------------------------------------------------------------
# Copy offline DB images & scripts
# -------------------------------------------------------------
COPY --from=downloader /downloads/*.tar /root/images/

RUN mkdir -p /root/workspace
WORKDIR /root/workspace

COPY . /root/workspace

RUN chmod +x /root/workspace/entrypoint.sh

ENTRYPOINT ["/root/workspace/entrypoint.sh"]

CMD [ "bash" ]
