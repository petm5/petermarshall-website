{ pkgs ? import <nixpkgs> { } }:
with pkgs;
mkShellNoCC {
  packages = [
    nodejs
    wrangler
  ];
}
