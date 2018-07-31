.PHONY: publish
publish:
	git checkout master
	scripts/check_branch_clean.sh
	bundle exec middleman build
	cp -a build/. docs
	git add docs
	git add -u
	git commit -m "Publish changes to GitHub pages"
	git push origin master
