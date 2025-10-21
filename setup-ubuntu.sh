#!/bin/bash

# this is just for getting puppeteer to run in a github action
# see https://pptr.dev/troubleshooting#issues-with-apparmor-on-ubuntu

echo 0 | sudo tee /proc/sys/kernel/apparmor_restrict_unprivileged_userns