import os
import shutil
import subprocess


BASE_DIR = "./repos"


class RepoService:

    def clone_repo(self, repo_url: str, project_id: str):

        path = os.path.join(BASE_DIR, project_id)

        # delete old version
        if os.path.exists(path):
            shutil.rmtree(path)

        subprocess.run(
            ["git", "clone", repo_url, path],
            check=True
        )

        return path


repo_service = RepoService()
