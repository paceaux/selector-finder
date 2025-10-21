#!/bin/bash

# this is just for getting puppeteer to run in a github action
# see https://pptr.dev/troubleshooting#issues-with-apparmor-on-ubuntu

export CHROMIUM_BUILD_PATH=/@{HOME}/chromium/src/out/**/chrome
cat | sudo tee /etc/apparmor.d/chrome-dev-builds <<EOF
abi <abi/4.0>,
include <tunables/global>

profile chrome $CHROMIUM_BUILD_PATH flags=(unconfined) {
  userns,

  # Site-specific additions and overrides. See local/README for details.
  include if exists <local/chrome>
}
EOF

cd ~/.cache/puppeteer/chrome/linux-<version>/chrome-linux64/
sudo chown root:root chrome_sandbox
sudo chmod 4755 chrome_sandbox
# copy sandbox executable to a shared location
sudo cp -p chrome_sandbox /usr/local/sbin/chrome-devel-sandbox
# export CHROME_DEVEL_SANDBOX env variable
export CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox

sudo service apparmor reload  # reload AppArmor profiles to include the new one

