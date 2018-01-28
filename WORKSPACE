load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

git_repository(
    name = "build_bazel_rules_nodejs",
    remote = "https://github.com/bazelbuild/rules_nodejs.git",
    tag = "0.3.1", # check for the latest tag when you install
)

load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories")

node_repositories(package_json = ["//:package.json"])


# Include @bazel/typescript in package.json#devDependencies
# Add TypeScript rules
git_repository(
  name = "build_bazel_rules_typescript",
  remote = "https://github.com/bazelbuild/rules_typescript.git",
  commit = "eb3244363e1cb265c84e723b347926f28c29aa35",
)
# local_repository(
#     name = "build_bazel_rules_typescript",
#     path = "node_modules/@bazel/typescript",
#)

load("@build_bazel_rules_typescript//:defs.bzl", "ts_setup_workspace")

ts_setup_workspace()

# ts_devserver needs the Go rules.
# See https://github.com/bazelbuild/rules_go#setup for the latest version.
http_archive(
    name = "io_bazel_rules_go",
    url = "https://github.com/bazelbuild/rules_go/releases/download/0.8.1/rules_go-0.8.1.tar.gz",
    sha256 = "90bb270d0a92ed5c83558b2797346917c46547f6f7103e648941ecdb6b9d0e72",
)

load("@io_bazel_rules_go//go:def.bzl", "go_rules_dependencies", "go_register_toolchains")

go_rules_dependencies()
go_register_toolchains()
