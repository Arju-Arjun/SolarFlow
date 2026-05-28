<<<<<<< HEAD

import os
from backend.app import create_app


app = create_app()


if __name__ == "__main__":
	port = int(os.environ.get("PORT", 5000))
	debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
	app.run(host="0.0.0.0", port=port, debug=debug)

=======
import os
from app import create_app   # IMPORTANT: remove "backend."

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a
