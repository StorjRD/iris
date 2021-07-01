import {
	register,
	login,
	createProject,
	createApiKey,
	getProjects,
	SatelliteError
} from "../lib/satellite";

export default {
	namespaced: true,

	state: () => {
		const sessionJson = null; // localStorage.getItem("session");

		if (typeof sessionJson === "string") {
			const cachedLogin = JSON.parse(sessionJson);

			return cachedLogin;
		}

		return {
			email: null,
			token: null,
			apiKey: null,
			projectId: null,
			errorMessage: null,
			loggingIn: false
		};
	},
	mutations: {
		setSession(state, { email, token, apiKey, projectId }) {
			console.log("setSession", { email, token, apiKey, projectId });

			state.email = email;
			state.token = token;
			state.apiKey = apiKey;
			state.projectId = projectId;
			state.loggingIn = false;

			/*
			localStorage.setItem(
				"session",
				JSON.stringify({
					email,
					token,
					apiKey,
					projectId
				})
			);
			*/
		},
		setErrorMessage(state, { message }) {
			state.errorMessage = message;
			state.loggingIn = false;
		},
		setEmail(state, { email }) {
			state.email = email;
		},
		startLogin(state) {
			state.loggingIn = true;
			state.errorMessage = "";
		}
	},
	actions: {
		async signUp({ commit, dispatch }, { email, password }) {
			try {
				await register({
					fullName: "Iris User",
					shortName: "Iris User",
					email,
					password
				});
			} catch(err) {
				if (e instanceof SatelliteError) {
					commit("setErrorMessage", { message: e.message });
				}

				throw e;
			}


			return dispatch("login", {
				email,
				password
			});
		},

		async login({ commit }, { email, password }) {
			let token;

			commit("startLogin");

			try {
				const response = await login({
					email,
					password
				});

				token = response.token;
			} catch (e) {
				if (e instanceof SatelliteError) {
					commit("setErrorMessage", { message: e.message });
				}

				throw e;
			}

			// find and create Iris project
			const projectName = "Iris";

			const { myProjects } = await getProjects({ token });

			let projectId = myProjects.find(
				(project) => project.name === projectName
			).id;

			// create new project if it doesn't exist
			if (typeof projectId !== "string") {
				console.log("couldn't find Iris project, creating new one");

				const { id } = await createProject({
					token,
					name: projectName,
					description: "Your buckets created and managed by Iris."
				});

				projectId = id;
			}

			// create new api key
			const { key } = await createApiKey({
				token,
				projectId,
				name: `${projectName} Key ${Date.now()}`
			});

			commit("startLogin");

			commit("setSession", {
				email,
				token,
				projectId,
				apiKey: key
			});
		},

		async logout({ commit }) {
			commit("setSession", {
				email: null,
				token: null,
				projectId: null,
				apiKey: null
			});
		}
	},
	getters: {
		isLoggedIn: (state) => typeof state.token === "string"
	}
};
