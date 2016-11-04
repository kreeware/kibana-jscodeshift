#!/usr/bin/env bash

FILES="$(cat ../kibana-jscodeshift/all-files)"

# eslint --fix $FILES --quiet
jscodeshift -t ../kibana-jscodeshift/transforms/remove-anon-iffe.js $FILES

# eslint --fix $FILES --quiet
jscodeshift -t ../kibana-jscodeshift/transforms/unwrap-simple-amd.js $FILES

# eslint --fix $FILES --quiet
jscodeshift -t ../kibana-jscodeshift/transforms/remove-unused-basic-vars.js $FILES

# eslint --fix $FILES --quiet
jscodeshift -t ../kibana-jscodeshift/transforms/remove-unused-function-arguments.js $FILES

# eslint --fix $FILES --quiet
jscodeshift -t ../kibana-jscodeshift/transforms/remove-unused-basic-requires.js $FILES

# eslint --fix $FILES --quiet
jscodeshift -t ../kibana-jscodeshift/transforms/require-to-import.js $FILES

# eslint --fix $FILES --quiet
jscodeshift -t ../kibana-jscodeshift/transforms/remove-unused-imports.js $FILES

# eslint --fix $FILES --quiet
jscodeshift -t ../kibana-jscodeshift/transforms/remove-unused-assignments.js $FILES --run-in-band

# eslint --fix $FILES --quiet
