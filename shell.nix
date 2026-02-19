{ pkgs ? import <nixpkgs> { }, withWrangler ? false }:
with pkgs;
mkShellNoCC {
  packages = [
    nodejs
  ] ++ (lib.optionals withWrangler [
    wrangler
  ]);
}
