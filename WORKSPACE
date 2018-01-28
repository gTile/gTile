workspace(name = "gtiles")

load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

git_repository(
    name = "build_bazel_rules_nodejs",
    remote = "https://github.com/bazelbuild/rules_nodejs.git",
    commit = "230d39a391226f51c03448f91eb61370e2e58c42",
)

load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories")

# git_repository(
#     name = "build_bazel_rules_nodejs",
#     remote = "https://github.com/bazelbuild/rules_nodejs.git",
#     tag = "0.0.2", # check for the latest tag when you install
# )

# load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories")

node_repositories(package_json = ["//:package.json"])


# Include @bazel/typescript in package.json#devDependencies
# local_repository(
#     name = "build_bazel_rules_typescript",
#     path = "node_modules/@bazel/typescript",
# )

git_repository(
    name = "build_bazel_rules_typescript",
    remote = "https://github.com/bazelbuild/rules_typescript.git",
    commit = "eb3244363e1cb265c84e723b347926f28c29aa35",
)

load("@build_bazel_rules_typescript//:defs.bzl", "ts_setup_workspace")

# This points all `ts_library` rules at your normal tsconfig.json file, which
# should also be the one your editor uses so that settings match.
# Update this value to match where your tsconfig.json file lives.
#ts_setup_workspace(default_tsconfig = "@gtiles//:tsconfig.json")
ts_setup_workspace()
