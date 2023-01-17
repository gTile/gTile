workspace(
    # How this workspace would be referenced with absolute labels from another workspace
    name = "gtile",
)

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "0f2de53628e848c1691e5729b515022f5a77369c76a09fbe55611e12731c90e3",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/2.0.1/rules_nodejs-2.0.1.tar.gz"],
)

#load("@build_bazel_rules_nodejs//:index.bzl", "node_repositories", "yarn_install")
load("@build_bazel_rules_nodejs//:index.bzl", "yarn_install")

# NOTE: this rule installs nodejs, npm, and yarn, but does NOT install
# your npm dependencies into your node_modules folder.
# You must still run the package manager to do this.
#node_repositories(package_json = ["//:package.json"])

yarn_install(
    name = "npm",
    package_json = "//:package.json",
    yarn_lock = "//:yarn.lock",
)

# For testing, use Karma per
# Per https://bazelbuild.github.io/rules_nodejs/Karma.html

# Fetch transitive Bazel dependencies of @bazel/karma
load("@npm//@bazel/karma:package.bzl", "npm_bazel_karma_dependencies")
npm_bazel_karma_dependencies()

# Set up web testing, choose browsers we can test on
load("@io_bazel_rules_webtesting//web:repositories.bzl", "web_test_repositories")

web_test_repositories()

load("@io_bazel_rules_webtesting//web/versioned:browsers-0.3.2.bzl", "browser_repositories")

browser_repositories(
    # There is no GJS option. GJS is based on Mozilla's SpiderMonkey, though.
    chromium = True,
    firefox = True,
)