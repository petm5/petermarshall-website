{
  stdenv,
  nodejs,
  fetchPnpmDeps,
  pnpm_10,
  pnpmConfigHook,
  pnpmBuildHook,
  ...
}:

let
  packageJson = builtins.fromJSON (builtins.readFile ./package.json);

  pnpm = pnpm_10;
in

stdenv.mkDerivation (self: {
  pname = packageJson.name;
  version = packageJson.version;
  src = ./.;

  pnpmDeps = fetchPnpmDeps {
    inherit (self) pname version src;
    inherit pnpm;
    fetcherVersion = 4;
    hash = "sha256-BBmQltd9CvWWZL4yMuBb6iglYUblVoGMwEGfTB+p1FE=";
  };

  nativeBuildInputs = [
    nodejs
    pnpmConfigHook
    pnpmBuildHook
    pnpm
  ];

  installPhase = ''
    mkdir -p $out
    cp -r build/* $out
  '';
})
