#!/usr/bin/env bash

find src ui_framework utilities webpackShims test tasks -not \( -path src/core_plugins/console -prune \) -name \*.js