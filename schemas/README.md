To regenerate the compiled file, run

```shell
glib-compile-schemas [PATH TO THIS DIR]
```

To regenerate the Typescript typings, run

```shell
bazel run //schemas:extract_settings_type_definition -- \
  --gschema_xml $PWD/schemas/org.gnome.shell.extensions.gtile.gschema.xml \
  --output_ts $PWD/settings_data.ts
```
