# GCP base image
FROM us-west1-docker.pkg.dev/proximal-core-0/environments/base:latest


# ========================================
# Layer 2: Python installation (rarely changes)
# ========================================
RUN git clone https://github.com/pyenv/pyenv.git ~/.pyenv
ENV PYENV_ROOT="/root/.pyenv"
ENV PATH="$PYENV_ROOT/bin:$PATH"

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


# ========================================
# Layer 3: Node installation (rarely changes)
# ========================================
ENV NVM_DIR="/root/.nvm"
RUN mkdir -p $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

COPY .nvmrc /root/.nvmrc

RUN bash -c 'source $NVM_DIR/nvm.sh && \
    target_ver=$(cat /root/.nvmrc) && \
    nvm install $target_ver && \
    nvm use $target_ver && \
    resolved_ver=$(nvm current) && \
    ln -s $NVM_DIR/versions/node/$resolved_ver/bin/node /usr/local/bin/node && \
    ln -s $NVM_DIR/versions/node/$resolved_ver/bin/npm /usr/local/bin/npm'

RUN rm /root/.nvmrc


# ========================================
# Layer 4: Workspace
# ========================================
RUN mkdir -p /root/workspace
WORKDIR /root/workspace

RUN npm ci
