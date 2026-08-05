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
        inherit (pkgs) lib;
      in
      rec {
        packages = rec {
          petermarshall-ca = pkgs.callPackage ./package.nix {};
          default = petermarshall-ca;
        };
        devShells = {
          default = pkgs.mkShellNoCC {
            inputsFrom = [ packages.petermarshall-ca ];
          };
          wrangler = pkgs.mkShellNoCC {
            packages = with pkgs; [ wrangler ];
            inputsFrom = [ packages.petermarshall-ca ];
          };
        };
      }
    );
}
