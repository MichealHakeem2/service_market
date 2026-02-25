const permit = (...roles) => {

    return (req, res, next) => {

        if (!req.user)
            return res.status(403).json({
                message: "Unauthorized"
            });

        if (!roles.includes(req.user.role))
            return res.status(403).json({
                message: "Access denied"
            });
        else {
            next();
        }

    };

};
module.exports = permit;