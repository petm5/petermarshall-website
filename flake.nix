{
  description = "Peter Marshall's homepage";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        inherit (pkgs) lib;

        devServer = pkgs.writeShellApplication {
          name = "dev-server";
          runtimeInputs = with pkgs; [ nodejs ];
          text = ''
            npm run dev
          '';
        };
      in
      {
        packages = rec {
          petermarshall-ca = pkgs.callPackage ./package.nix {};
          default = petermarshall-ca;
        };
        apps = rec {
          dev-server = {
            type = "app";
            program = lib.getExe devServer;
          };
          default = dev-server;
        };
        devShells.default = pkgs.mkShellNoCC {
          inputsFrom = [ devServer ];
        };
        devShells.wrangler = pkgs.mkShellNoCC {
          packages = with pkgs; [ wrangler ];
          inputsFrom = [ devServer ];
        };
      }
    );
}
