{
  buildNpmPackage,
  importNpmLock,
  ...
}:

let
  packageJson = builtins.fromJSON (builtins.readFile ./package.json);
in

buildNpmPackage {
  pname = packageJson.name;
  version = packageJson.version;
  src = ./.;

  npmDeps = importNpmLock {
    npmRoot = ./.;
  };

  npmConfigHook = importNpmLock.npmConfigHook;

  installPhase = ''
    mkdir -p $out/share/nginx/html
    cp -r build/* $out/share/nginx/html
  '';
}
