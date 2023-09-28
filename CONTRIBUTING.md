# How to Contribute to SelectorHound

## Did you find a bug?

1. Check and see if it's already been reported under [issues](https://github.com/paceaux/selector-finder/issues).
    * Add your own comments to the issue if you have more information to add
    * Exact parameters you passed in
    * Relevant excerpts from your log.txt file

2. If it hasn't been reported, [open a new issue](https://github.com/paceaux/selector-finder/issues/new)
    * Include a title and clear description
    * Include the exact parameters you passed in
    * include a sample of the output from your log.txt file
    * Include your version of node and npm

## Would you like a new feature?

1. Check [our enhancements](https://github.com/paceaux/selector-finder/labels/enhancement).
2. If yours isn't there, open a new issue and set the label as "enhancement";
    * Use the title to explain in 1 sentence what you're looking for
    * In the description, explain in a few bullet points:
        * How a developer would know the feature has been delivered
        * What the motivation is for this feature?

## Would you like to contribute to this?

0. Find an issue that you'd like to work on
1. Clone this repository
2. Make a branch off of `develop` labeled `[issue number]-[short description]`
3. Do your work
4. JSDoc your code
5. Write unit tests
6. Run the linter
7. Submit a PR to `develop`
8. Include how you tested the CLI
9. Indicate whether this is a patch, minor, or major change

### What happens after your PR is approved?

1. It will be merged into `develop`
2. The maintainers will run tests and test the CLI with more  examples
3. They may or may not include additional issues in the merge to develop
4. When develop is ready for a release, a maintainer will increment the package version and merge it into `master`
5. The maintainer will tag the release in `master` and push it to npm
