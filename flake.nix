{
  description = "Peter Marshall's homepage";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system}; in
      {
        packages = rec {
          petermarshall-ca = pkgs.callPackage ./package.nix {};
          default = petermarshall-ca;
        };
        devShells.default = import ./shell.nix { inherit pkgs; };
      }
    );
}
