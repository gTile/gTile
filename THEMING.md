# Theming gTile

Before the theming, before you must the follow developing instructions.

## Adding new theme

1. Add your theme name into [the schema](/schemas/org.gnome.shell.extensions.gtile.gschema.xml) under themes.
2. Run `glib-compile-schemas schemas`

### Anatomy of extension

![Anatomy](./images/anatomy.svg)

You can use the above-mentioned class names to style your theme.

You must add `gtile-[THEME NAME]__` to the beginning of classes outside the main container.

### Install extension

Install extension with Bazel

```shell
bazel run :install-extension
```

If succeeded, hit `Alt`+`F2`, type `r`, and hit enter.

## Adding new icon

If icons are .svg format supports automatically create an export 3 resolution of the icon. (Requires [inkscape](https://inkscape.org/))

1. Add your icons into the `/images/icons/[THEME]/source`.

2. Run auto generate

  ```shell
  cd images
  ./auto-generate.sh
  ```
