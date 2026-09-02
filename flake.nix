{
  description = "Peter Marshall's homepage";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        devPackages = with pkgs; [
          nodejs
          pnpm
          typescript
        ];
      in
      {
        devShells = {
          default = pkgs.mkShellNoCC {
            packages = devPackages;
          };
          wrangler = pkgs.mkShellNoCC {
            packages = (with pkgs; [
              wrangler
              cloudflared
            ]) ++ devPackages;
          };
        };
      }
    );
}
